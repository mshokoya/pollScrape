import { cpus } from 'os'
import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db.sqlite',
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