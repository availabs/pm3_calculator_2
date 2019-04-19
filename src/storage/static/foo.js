#!/usr/bin/env node

const { chain, sum } = require('lodash')

const d0 = require('./AVAILTrafficDistributionProfiles')

const d1 = chain(d0).mapValues(arr => arr.map(x => x / 100)).value()

// Object.keys(d1).forEach(p => {
  // console.log(p, ':', sum(d1[p]))
// })

console.log(JSON.stringify(d1,null,4))
