const parser = require('pg-query-parser');

const getAllRelations = (acc = [], sub) => {
  if (!sub) {
    return acc;
  }

  if (sub !== Object(sub)) {
    return acc;
  }

  const { schemaname = 'public', relname } = sub;

  // Ignore tmp_* tables (TEMPORARY tables prefix)
  if (relname && !relname.match(/^tmp_/)) {
    acc.push({ schemaname, relname });
  }

  const keys = Object.keys(sub).filter(k => !k.match(/schemaname|relname/));

  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    // The "relation" key is for DDL targets.
    //   We ignore these as we are only interested in tables within FROM clauses.
    if (k !== 'relation') {
      Array.prototype.push.apply(acc, getAllRelations([], sub[k]));
    }
  }

  return acc;
};

const extractRequiredRelations = sql => {
  const { query } = parser.parse(sql);

  let requiredRelations = [];

  for (let i = 0; i < query.length; i += 1) {
    const stmts = query[i];
    const createStmts = Object.keys(stmts);

    for (let j = 0; j < createStmts.length; j += 1) {
      Array.prototype.push.apply(
        requiredRelations,
        getAllRelations([], stmts[createStmts[j]])
      );
    }
  }

  requiredRelations = [
    ...new Set(requiredRelations.map(d => JSON.stringify(d)).sort())
  ];
  requiredRelations = requiredRelations.map(d => JSON.parse(d));

  return requiredRelations;
};

module.exports = extractRequiredRelations;
