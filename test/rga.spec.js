/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const CRDT = require('../')

describe('rga', () => {

  describe('local', () => {
    let RGA
    let rga
    it ('type can be created', () => {
      RGA = CRDT('rga')
    })

    it ('can be instantiated', () => {
      rga = RGA('id1')
    })

    it('starts empty', () => {
      expect(rga.value()).to.be.empty()
    })

    it('adds to the right value', () => {
      rga.addRight(null, 'a')
    })

    it('and the value is inserted', () => {
      expect(rga.value()).to.deep.equal(['a'])
    })

    it('pushes', () => {
      rga.push('b')
    })

    it('and the value is inserted', () => {
      expect(rga.value()).to.deep.equal(['a', 'b'])
    })
  })

  describe('together', () => {
    let RGA = CRDT('rga')

    let replica1, replica2
    let deltas = [[], []]
    before(() => {
      replica1 = RGA('id1')
      replica2 = RGA('id2')
    })

    it('values can be written concurrently', () => {
      deltas[0].push(replica1.push('a'))
      deltas[0].push(replica1.push('b'))
      deltas[1].push(replica2.push('c'))
      deltas[1].push(replica2.push('d'))
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(delta))
      expect(replica1.value()).to.deep.equal(['a', 'b', 'c', 'd'])
    })

    it('and the second also converges', () => {
      deltas[0].forEach((delta) => replica2.apply(delta))
      expect(replica2.value()).to.deep.equal(['a', 'b', 'c', 'd'])
    })

    it('values can be deleted concurrently', () => {
      deltas = [[], []]
      deltas[0].push(replica1.removeAt(1))
      deltas[1].push(replica2.removeAt(2))
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(delta))
      expect(replica1.value()).to.deep.equal(['a', 'd'])
    })

    it('and the second also converges', () => {
      deltas[0].forEach((delta) => replica2.apply(delta))
      expect(replica2.value()).to.deep.equal(['a', 'd'])
    })

    it('values can be further added concurrently', () => {
      deltas = [[], []]
      deltas[0].push(replica1.push('e'))
      deltas[0].push(replica1.push('f'))
      deltas[1].push(replica2.push('g'))
      deltas[1].push(replica2.push('h'))
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(delta))
      expect(replica1.value()).to.deep.equal(['a', 'd', 'e', 'f', 'g', 'h'])
    })

    it('and the second also converges', () => {
      deltas[0].forEach((delta) => replica2.apply(delta))
      expect(replica2.value()).to.deep.equal(['a', 'd', 'e', 'f', 'g', 'h'])
    })

    it('values can be inserted concurrently', () => {
      deltas = [[], []]
      deltas[0].push(replica1.insertAt(3, 'e.1'))
      deltas[1].push(replica2.insertAt(3, 'e.2'))
    })

    it('the first converges', () => {
      deltas[1].forEach((delta) => replica1.apply(delta))
      expect(replica1.value()).to.deep.equal(['a', 'd', 'e', 'e.1', 'e.2', 'f', 'g', 'h'])
    })

    it('and the second also converges', () => {
      deltas[0].forEach((delta) => replica2.apply(delta))
      expect(replica2.value()).to.deep.equal(['a', 'd', 'e', 'e.1', 'e.2', 'f', 'g', 'h'])
    })
  })
})
