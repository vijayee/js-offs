'use strict'
const express = require('express')
const OffUrl = require('./off-url')
const collect = require('collect-stream')
const config = require('./config')
const through = require('through2')
const ExpirationMap = require('./expiration-map')
const pth = require('path')
let basename
let parse = pth.posix.parse
if (/^win/.test(process.platform)) {
  basename = pth.win32.basename
} else {
  basename = pth.posix.basename
}
let ofdCache = new ExpirationMap(config.ofdTimeout)
module.exports = function (br, emit) {
  let off = express()
  off.get(/\/offsystem\/v3\/([-+.\w]+\/[-+.\w]+)\/(\d+)\/([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)\/([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)\/([^ !$`&*()+]*|\\[ !$`&*()+]*)+/,
    (req, res) => {
      let start = 0
      let end = parseInt(req.params[ 1 ])
      /*
       if (req.headers.range) {
       let range = req.headers.range
       let positions = range.replace(/bytes=/, "").split("-")
       start = positions[ 0 ] ? parseInt(positions[ 0 ]) : null
       end = positions[ 1 ] ? parseInt(positions[ 1 ]) : req.params[ 1 ]
       }*/
      let url = new OffUrl()
      url.contentType = req.params[ 0 ]
      url.streamOffset = start
      url.streamLength = parseInt(req.params[ 1 ])
      url.streamOffsetLength = parseInt(end)
      url.fileHash = req.params[ 2 ]
      url.descriptorHash = req.params[ 3 ]
      url.fileName = req.params[ 4 ]
      let rs
      try {
        rs = br.createReadStream(url)
      } catch (ex) {
        emit('error', ex)
        return res.status(500).send(ex.message)
      }
      if (url.contentType === 'offsystem/directory') {
        let handleFolder = function (ofd) {
          let stats = parse(url.fileName) //This is where we figure out if it is for the base directory or some file or directory withi
          if (stats.ext === '.ofd') {
            let index = ofd[ 'index.html' ]
            if (index) {
              url = OffUrl.parse(index)
              let rs
              try {
                rs = br.createReadStream(url)
              } catch (ex) {
                emit('error', ex)
                return res.status(500).send(ex.message)
              }
              rs.once('error', (err) => {
                emit('error', err)
                res.status(500).send()
                res.end()
              })
              res.type(url.contentType)
              return rs.pipe(res)
            } else {
              res.write(JSON.stringify(ofd))
              res.end()
            }
          } else {
            let file = ofd[ url.fileName ]
            if (file) {
              url = OffUrl.parse(file)
              let rs
              try {
                rs = br.createReadStream(url)
              } catch (ex) {
                emit('error', ex)
                return res.status(500).send()
              }
              rs.once('error', (err) => {
                emit('error', err)
                res.status(500).send()
                res.end()
              })
              res.type(url.contentType)
              return rs.pipe(res)
            } else {
              return res.status(404).send("Resource Not Found")
            }
          }
        }
        if (ofdCache.has(url.fileHash)) {
          let ofd = ofdCache.get(url.fileHash)
          if(req.query.ofd === 'raw') {
            res.writeHead(200, {
              'Content-Type': 'text/json'
            })
            //}
            rs.once('error', (err) => {
              emit('error', err)
              res.status(500).send()
              res.end()
            })
            rs.pipe(res)
          } else {
            handleFolder(ofd)
          }
        } else {
          if(req.query.ofd === 'raw') {
            res.writeHead(200, {
              'Content-Type': 'text/json'
            })
            //}
            rs.once('error', (err) => {
              emit('error', err)
              res.status(500).send()
              res.end()
            })
            rs.pipe(res)

          } else {
            collect(rs, (err, data) => {
              if (err) {
                emit('error', err)
                return res.status(500).send("Server Error")
              }
              let ofd = JSON.parse(data.toString('utf8'))
              ofdCache.set(url.fileHash, ofd)
              handleFolder(ofd)
            })
          }
        }
      } else {
        /* if (req.headers.range) {
         let length = end - start
         let code = (length === url.streamLength ? 200 : 206)
         res.writeHead(code, {
         "Content-Range": "bytes " + start + "-" + end + "/" + req.params[ 1 ],
         "Accept-Ranges": "bytes",
         "Content-Type": url.contentType
         })
         } else {*/
        res.writeHead(200, {
          'Content-Type': url.contentType
        })
        //}
        rs.once('error', (err) => {
          emit('error', err)
          res.status(500).send()
          res.end()
        })
        rs.pipe(res)

      }
    })

  off.put('/offsystem/', (req, res)=> {
    let url = new OffUrl()
    try {
      url.serverAddress = req.get('server-address') || url.serverAddress
      url.contentType = req.get('type')
      url.fileName = req.get('file-name')
      url.streamLength = parseInt(req.get('stream-length'))
    } catch (err) {
      emit(err)
      res.status(500).send('Invalid URL Headers')
    }
    let recycle = req.get('recycler')
    let temporary = req.get('temporary')
    if (!url.streamLength) {
      res.status(500).send('Empty Stream')
      return res.end()
    }
    try {
      let ws
      if (!recycle) {
        ws = br.createWriteStream(url, temporary)

      } else {
        let urls = JSON.parse(recycle)
        urls = urls.map((url) => OffUrl.parse(url))
        ws = br.createWriteStreamWithRecycler(url, urls, temporary)
      }
      ws.once('url', (url)=> {
        res.write(url.toString())
        res.end()
      })
      ws.once('error', (err) => {
        emit('error', err)
        res.status(500).send()
        res.end()
      })
      req.pipe(ws)
    } catch (ex) {
      emit('error', ex)
      res.status(500).send()
    }
  })
  // Delete Temporary Block
  off.delete(/\/offsystem\/v3\/([-+.\w]+\/[-+.\w]+)\/(\d+)\/([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)\/([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)\/([^ !$`&*()+]*|\\[ !$`&*()+]*)+/,
    (req, res) => {
      let start = 0
      let end = parseInt(req.params[ 1 ])
      let url = new OffUrl()
      url.contentType = req.params[ 0 ]
      url.streamOffset = start
      url.streamLength = parseInt(req.params[ 1 ])
      url.streamOffsetLength = parseInt(end)
      url.fileHash = req.params[ 2 ]
      url.descriptorHash = req.params[ 3 ]
      url.fileName = req.params[ 4 ]
      br.removeTemporaries(url, (err) => {
        if (err) {
          emit('error', ex)
          return res.status(500).send()
        }
      })
    })
  // Release Temporary Status
  off.post(/\/offsystem\/v3\/([-+.\w]+\/[-+.\w]+)\/(\d+)\/([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)\/([123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)\/([^ !$`&*()+]*|\\[ !$`&*()+]*)+/,
    (req, res) => {
      let start = 0
      let end = parseInt(req.params[ 1 ])
      let url = new OffUrl()
      url.contentType = req.params[ 0 ]
      url.streamOffset = start
      url.streamLength = parseInt(req.params[ 1 ])
      url.streamOffsetLength = parseInt(end)
      url.fileHash = req.params[ 2 ]
      url.descriptorHash = req.params[ 3 ]
      url.fileName = req.params[ 4 ]
      try {
        br.releaseTemporaries(url)
        return res.end('Success')
      } catch (ex) {
        emit('error', ex)
        return res.status(500).send()
      }
    })
  //off.use(express.static(pth.join(__dirname, 'static')))
  return off
}