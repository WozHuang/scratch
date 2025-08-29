import { Kysely, SqliteDialect } from 'kysely'

// 定义 DB schema
interface DB {
  person: {
    id: number
    name: string
    age: number
  }
}

// 创建 Kysely 实例
const db = new Kysely<DB>({
// 因为前端不能直接访问 sqlite 数据库，可以用一个空的 dialect 仅生成 SQL
  dialect: new SqliteDialect(null as any)
})

// 构造查询
const query = db
  .selectFrom('person')
  .select(['id', 'name'])
  .where('age', '>', 18)
  .orderBy('name', 'asc')

// 生成 SQL
const compiled = query.compile()
document.body.innerText = (`SQL:${compiled.sql}\nParameters:${compiled.parameters}`)

