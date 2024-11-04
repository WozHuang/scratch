import Knex from 'knex';

const k = Knex({
  client: 'sqlite3', // 或 'pg'，'sqlite3' 等
  useNullAsDefault: true // SQLite 时可以使用
});
// const k = knex({client: 'sqlite3'});
// k.client.transacting = true;

const sql = k('change').select('me').count().toSQL();

const bbb = k({ a: 'table', b: 'table' })
  .select({
    aTitle: 'a.title',
    bTitle: 'b.title'
  })
  .whereRaw('?? = ??', ['a.column_1', 'b.column_2']);

console.log(sql.sql);
console.log(sql.toNative().sql);
