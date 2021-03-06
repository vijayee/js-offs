const cbor = require('cbor-js')
const toAb = require('to-array-buffer')
const abToB = require('arraybuffer-to-buffer')
const extend = require('util')._extend
const fs = require('fs')
const path = require('path')
const kb = 1000
const mb = 1000000
const gb = 1000000000
let defaults = {
  blockPath: '.block-cache',
  miniPath: '.mini-cache',
  nanoPath: '.nano-cache',
  blockCacheSize: 10 * gb,
  miniBlockCacheSize: 10 * gb,
  nanoBlockCacheSize: 10 * gb,
  nano: 3,
  block: 1,
  mini: 2,
  tupleSize: 3,
  blockSize: 128000,
  miniBlockSize: 1000,
  nanoBlockSize: 136,
  descriptorPad: 32,
  scale: 2,
  filterSize: 20000,
  fingerprintSize: 4,
  hitBoxSize: 100,
  bucketSize: 4,
  httpPort: 23402,
  startPort: 8200,
  numPortTries: 2,
  nodeCount: 10, // how many nodes to find in or query in total
  concurrency: 3, // how many nodes to query simultaneously
  kbucketSize: 20, // size of each k bucket
  storeCount: 1, // how many nodes to store new data at
  maxFillRate: 72, // in hours
  redundancy: .30, //30% network redundancy target
  batchConcurrency: 10,
  cacheLocation: null,
  ofdTimeout: 60 * 1000 * 5,
  temporaryTimeout: 60 * 1000 *5,
  peerTimeout: 250,
  lastKnownPeers: true,
  internalIP: false,
  bucketTimeout: 60 * 1000 * 5,
  socketTimeout: 120 * 1000,
  bootstrap: [
    'L8t3oLLfnGZPgkkiAW2FwzHqeWt4pS9amGZQNpPKQgkNrF3JTGxptXuQwc8W7AdaRB34k2afQszr3LQqfUP6hzXgPGu5Rnw28sDwcA3GRrsnqbGYdpLETkSVBNXK1cJwRFRqfD'
  ]
}
let _blockPath = new WeakMap()
let _miniPath = new WeakMap()
let _nanoPath = new WeakMap()
let _blockCacheSize = new WeakMap()
let _miniBlockCacheSize = new WeakMap()
let _nanoBlockCacheSize = new WeakMap()
let _nano = new WeakMap()
let _block = new WeakMap()
let _mini = new WeakMap()
let _tupleSize = new WeakMap()
let _blockSize = new WeakMap()
let _miniBlockSize = new WeakMap()
let _nanoBlockSize = new WeakMap()
let _descriptorPad = new WeakMap()
let _scale = new WeakMap()
let _filterSize = new WeakMap()
let _fingerprintSize = new WeakMap()
let _hitBoxSize = new WeakMap()
let _bucketSize = new WeakMap()
let _httpPort = new WeakMap()
let _startPort = new WeakMap()
let _numPortTries = new WeakMap()
let _nodeCount = new WeakMap()
let _concurrency = new WeakMap()
let _kbucketSize = new WeakMap()
let _storeCount = new WeakMap()
let _maxFillRate = new WeakMap()
let _redundancy = new WeakMap()
let _batchConcurrency = new WeakMap()
let _cacheLocation = new WeakMap()
let _ofdTimeout = new WeakMap()
let _temporaryTimeout = new WeakMap()
let _peerTimeout = new WeakMap()
let _lastKnownPeers = new WeakMap()
let _internalIP = new WeakMap()
let _bootstrap = new WeakMap()
let _path = new WeakMap()
let _bucketTimeout = new WeakMap()
let _socketTimeout = new WeakMap()
class Config {
  constructor () {
  }
  save (pth) {
    if (!pth) {
      pth = _path.get(this)
    }
    _path.set(this, pth)
    let buf = abToB(cbor.encode(this.toJSON()))
    let fd = path.join(pth, 'config')
    fs.writeFile(fd, buf, (err) => {
      if (err) {
       console.error(err)
       //TODO Dunno what to do with this error
      }
    })
  }
  load (pth) {
    try {
      let buf = fs.readFileSync(path.join(pth, 'config'))
      let config = cbor.decode(toAb(buf))
      _path.set(this, pth)
      _blockPath.set(this, config.blockPath)
      _miniPath.set(this, config.miniPath)
      _nanoPath.set(this, config.nanoPath)
      _blockCacheSize.set(this, config.blockCacheSize)
      _miniBlockCacheSize.set(this, config.miniBlockCacheSize)
      _nanoBlockCacheSize.set(this, config.nanoBlockCacheSize)
      _nano.set(this, config.nano)
      _block.set(this, config.block)
      _mini.set(this, config.mini)
      _tupleSize.set(this, config.tupleSize)
      _blockSize.set(this, config.blockSize)
      _miniBlockSize.set(this, config.miniBlockSize)
      _nanoBlockSize.set(this, config.nanoBlockSize)
      _descriptorPad.set(this, config.descriptorPad)
      _scale.set(this, config.scale)
      _filterSize.set(this, config.filterSize)
      _fingerprintSize.set(this, config.fingerprintSize > 4 ? 4 : config.fingerprintSize)
      _hitBoxSize.set(this, config.hitBoxSize)
      _bucketSize.set(this, config.bucketSize)
      _httpPort.set(this, config.httpPort)
      _startPort.set(this, config.startPort)
      _numPortTries.set(this, config.numPortTries)
      _nodeCount.set(this, config.nodeCount)
      _concurrency.set(this, config.concurrency)
      _kbucketSize.set(this, config.kbucketSize)
      _storeCount.set(this, config.storeCount)
      _maxFillRate.set(this, config.maxFillRate)
      _redundancy.set(this, config.redundancy)
      _batchConcurrency.set(this, config.batchConcurrency)
      _cacheLocation.set(this, config.cacheLocation)
      _ofdTimeout.set(this, config.ofdTimeout || defaults.ofdTimeout)
      _temporaryTimeout.set(this, config.temporaryTimeout || defaults.temporaryTimeout)
      _peerTimeout.set(this, config.peerTimeout || defaults.peerTimeout)
      _lastKnownPeers.set(this, config.lastKnownPeers || defaults.lastKnownPeers)
      _internalIP.set(this, config.internalIP, defaults.internalIP)
      _bootstrap.set(this, config.bootstrap.slice(0))
      _bucketTimeout.set(this, config.bucketTimeout || defaults.bucketTimeout)
      _socketTimeout.set(this, config.socketTimeout || defaults.socketTimeout)
    } catch (ex) {
      return ex
    }
  }
  loadDefaults () {
    _blockPath.set(this, defaults.blockPath)
    _miniPath.set(this, defaults.miniPath)
    _nanoPath.set(this, defaults.nanoPath)
    _blockCacheSize.set(this, defaults.blockCacheSize)
    _miniBlockCacheSize.set(this, defaults.miniBlockCacheSize)
    _nanoBlockCacheSize.set(this, defaults.nanoBlockCacheSize)
    _nano.set(this, defaults.nano)
    _block.set(this, defaults.block)
    _mini.set(this, defaults.mini)
    _tupleSize.set(this, defaults.tupleSize)
    _blockSize.set(this, defaults.blockSize)
    _miniBlockSize.set(this, defaults.miniBlockSize)
    _nanoBlockSize.set(this, defaults.nanoBlockSize)
    _descriptorPad.set(this, defaults.descriptorPad)
    _scale.set(this, defaults.scale)
    _filterSize.set(this, defaults.filterSize)
    _fingerprintSize.set(this, defaults.fingerprintSize)
    _hitBoxSize.set(this, defaults.hitBoxSize)
    _bucketSize.set(this, defaults.bucketSize)
    _httpPort.set(this, defaults.httpPort)
    _startPort.set(this, defaults.startPort)
    _numPortTries.set(this, defaults.numPortTries)
    _nodeCount.set(this, defaults.nodeCount)
    _concurrency.set(this, defaults.concurrency)
    _kbucketSize.set(this, defaults.kbucketSize)
    _storeCount.set(this, defaults.storeCount)
    _maxFillRate.set(this, defaults.maxFillRate)
    _redundancy.set(this, defaults.redundancy)
    _batchConcurrency.set(this, defaults.batchConcurrency)
    _cacheLocation.set(this, defaults.cacheLocation)
    _ofdTimeout.set(this, defaults.ofdTimeout)
    _temporaryTimeout.set(this, defaults.temporaryTimeout)
    _peerTimeout.set(this, defaults.peerTimeout)
    _lastKnownPeers.set(this, defaults.lastKnownPeers)
    _internalIP.set(this, defaults.internalIP)
    _bootstrap.set(this, defaults.bootstrap.slice(0))
    _bucketTimeout.set(this, defaults.bucketTimeout)
    _socketTimeout.set(this, defaults.socketTimeout)
  }

  get blockPath () {
    return _blockPath.get(this)
  }

  get miniPath () {
    return _miniPath.get(this)
  }

  get miniPath () {
    return _miniPath.get(this)
  }

  get blockPath () {
    return _blockPath.get(this)
  }

  get miniPath () {
    return _miniPath.get(this)
  }

  get nanoPath () {
    return _nanoPath.get(this)
  }

  get blockCacheSize () {
    return _blockCacheSize.get(this)
  }

  set blockCacheSize (value) {
    if (!Number.isInteger(+value)) {
      throw new TypeError("Invalid Block Cache Size")
    }
    if (value < 300 * mb) {
      throw new TypeError("Block Cache Size Is Too Small")
    }
    if (value > (549755813 * mb)) {
      throw new TypeError("Block Cache Size Is Too Large")
    }
    _blockCacheSize.set(this, value)
    this.save()
  }

  get miniBlockCacheSize () {
    return _miniBlockCacheSize.get(this)
  }

  set miniBlockCacheSize (value) {
    if (!Number.isInteger(+value)) {
      throw new TypeError("Invalid Mini Block Cache Size")
    }
    if (value < 300 * mb) {
      throw new TypeError("Mini Block Cache Size Is Too Small")
    }
    if (value > (42949672 * mb)) {
      throw new TypeError("Mini Block Cache Size Is Too Large")
    }
    _miniBlockCacheSize.set(this, value)
    this.save()
  }

  get nanoBlockCacheSize () {
    return _nanoBlockCacheSize.get(this)
  }

  set nanoBlockCacheSize (value) {
    if (!Number.isInteger(+value)) {
      throw new TypeError("Invalid Nano Block Cache Size")
    }
    if (value < 300 * mb) {
      throw new TypeError("Nano Block Cache Size Is Too Small")
    }
    if (value > (584115 * mb)) {
      throw new TypeError("Nano Block Cache Size Is Too Large")
    }
    _nanoBlockCacheSize.set(this, value)
    this.save()
  }

  get nano () {
    return _nano.get(this)
  }

  get block () {
    return _block.get(this)
  }

  get mini () {
    return _mini.get(this)
  }

  get tupleSize () {
    return _tupleSize.get(this)
  }

  get blockSize () {
    return _blockSize.get(this)
  }

  get miniBlockSize () {
    return _miniBlockSize.get(this)
  }

  get nanoBlockSize () {
    return _nanoBlockSize.get(this)
  }

  get descriptorPad () {
    return _descriptorPad.get(this)
  }

  get scale () {
    return _scale.get(this)
  }

  get filterSize () {
    return _filterSize.get(this)
  }

  get fingerprintSize () {
    return _fingerprintSize.get(this)
  }

  get hitBoxSize () {
    return _hitBoxSize.get(this)
  }

  get bucketSize () {
    return _bucketSize.get(this)
  }

  get httpPort () {
    return _httpPort.get(this)
  }

  set httpPort (value) {
    if (!Number.isInteger(+value)){
      throw new TypeError("Invalid HTTP Port")
    }
    _httpPort.set(this, value)
    this.save()
  }

  get startPort () {
    return _startPort.get(this)
  }

  set startPort (value) {
    if (!Number.isInteger(+value)){
      throw new TypeError("Invalid Port Number")
    }
    _startPort.set(this, value)
    this.save()
  }

  get numPortTries () {
    return _numPortTries.get(this)
  }

  set numPortTries (value) {
    if (!Number.isInteger(+value)){
      throw new TypeError("Invalid Number of Port Tries")
    }
    _numPortTries.set(this, value)
    this.save()
  }

  get nodeCount () {
    return _nodeCount.get(this)
  }

  get concurrency () {
    return _concurrency.get(this)
  }

  get kbucketSize () {
    return _kbucketSize.get(this)
  }

  get storeCount () {
    return _storeCount.get(this)
  }

  get maxFillRate () {
    return _maxFillRate.get(this)
  }

  get redundancy () {
    return _redundancy.get(this)
  }

  get batchConcurrency () {
    return _redundancy.get(this)
  }

  get cacheLocation  () {
    return _cacheLocation.get(this)
  }

  set cacheLocation (value) {
    _cacheLocation.set(this, value)
    this.save()
  }

  get bucketTimeout  () {
    return _bucketTimeout.get(this)
  }

  set bucketTimeout (value) {
    _bucketTimeout.set(this, value)
    this.save()
  }

  get bootstrap () {
    return _bootstrap.get(this).slice(0)
  }
  set bootstrap (value) {
    if (!Array.isArray(value)){
      throw new TypeError("Invalid Boostsrap Peer Array")
    }
    _bootstrap.set(this, value)
    this.save()
  }
  get ofdTimeout () {
    return _ofdTimeout.get(this)
  }
  get temporaryTimeout () {
    return _temporaryTimeout.get(this)
  }
  get peerTimeout () {
    return _peerTimeout.get(this)
  }
  get lastKnownPeers () {
    return _lastKnownPeers.get(this)
  }
  set lastKnownPeers(value) {
    _lastKnownPeers.set(this, !!value)
    this.save()
  }
  get internalIP () {
    return _internalIP.get(this)
  }
  set internalIP(value) {
    _internalIP.set(this, !!value)
    this.save()
  }
  get socketTimeout () {
    return _socketTimeout.get(this)
  }
  set socketTimeout (value) {
    _socketTimeout.set(this, +value)
    this.save()
  }

  toJSON () {
    return {
      blockPath: this.blockPath,
      miniPath: this.miniPath,
      nanoPath: this.nanoPath,
      blockCacheSize: this.blockCacheSize,
      miniBlockCacheSize: this.miniBlockCacheSize,
      nanoBlockCacheSize: this.nanoBlockCacheSize,
      nano: this.nano,
      block: this.block,
      mini: this.mini,
      tupleSize: this.tupleSize,
      blockSize: this.blockSize,
      miniBlockSize: this.miniBlockSize,
      nanoBlockSize: this.nanoBlockSize,
      descriptorPad: this.descriptorPad,
      scale: this.scale,
      filterSize: this.filterSize,
      fingerprintSize: this.fingerprintSize,
      hitBoxSize: this.hitBoxSize,
      bucketSize: this.bucketSize,
      httpPort: this.httpPort,
      startPort: this.startPort,
      numPortTries: this.numPortTries,
      nodeCount: this.nodeCount,
      concurrency: this.concurrency,
      kbucketSize: this.kbucketSize,
      storeCount: this.storeCount,
      maxFillRate: this.maxFillRate,
      redundancy: this.redundancy,
      batchConcurrency: this.batchConcurrency,
      cacheLocation: this.cacheLocation,
      temporaryTimeout: this.temporaryTimeout,
      peerTimeout: this.peerTimeout,
      lastKnownPeers: this.lastKnownPeers,
      internalIP: this.internalIP,
      bucketTimeout: this.bucketTimeout,
      bootstrap: this.bootstrap,
      socketTimeout: this.socketTimeout
    }
  }
}
module.exports = new Config()