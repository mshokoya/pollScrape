import { cpus } from 'os'
import { Sequelize } from 'sequelize'

// const dbPath =
//   process.env.NODE_ENV === 'development' ? './ugly.db' : join(process.resourcesPath, './ugly.db')
const dbPath = './ugly.db'

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  username: null,
  password: null,
  host: null,
  pool: {
    max: cpus().length,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
})

export const startConnection = async () => {
  try {
    await sequelize.authenticate()
    console.log('Connection has been established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }
}

export const syncDB = () =>
  sequelize.sync().then(() => {
    console.log('Database synchronized')
  })
