const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const objectSnakeToCamel = newObject => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  }
}

const districtSnakeToCamel = newObject => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  }
}

const reportSnakeToCamel = newObject => {
  return {
    totalCases: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  }
}

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running')
    })
  } catch (e) {
    console.error(`error ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

app.get('/states/', async (request, response) => {
  const getstatesQuesry = `
        SELECT * FROM state ;
    `
  const stateList = await db.all(getstatesQuesry)
  const stateResult = stateList.map(eachObject => {
    return objectSnakeToCamel(eachObject)
  })

  response.send(stateResult)
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
        SELECT * FROM state WHERE state_id = ${stateId};
    `
  const stateResult = await db.get(getStateQuery)
  response.send(objectSnakeToCamel(stateResult))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const newDistrict = `
        INSERT INTO 
        district(district_name, state_id,cases,cured,active,deaths)
        VALUES
            (
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths}
            );
    `

  const addDistrict = await db.run(newDistrict)
  const districtId = addDistrict.lastId
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
        SELECT  * FROM district WHERE district_id = ${districtId};
    `
  const districtResult = await db.get(getDistrictQuery)
  response.send(districtSnakeToCamel(districtResult))
})

// app.delete('/districts/:districtId/', async (request, response) => {
//   const {districtId} = request.params
//   const deleteQuery = `
//         DELETE FROM district WHERE district_id = ${districtId};
//     `
//   await db.run(deleteQuery)
//   response.send('District Removed')
// })

// app.put('/districts/:districtId/', async (request, response) => {
//   const {districtName, stateId, cases, cured, active, deaths} = request.body
//   const {districtId} = request.params
//   const updateDistrictQuery = `
//     UPDATE district SET
//         district_name = '${districtName}',
//         state_id = ${stateId},
//         cases = ${cases},
//         cured= ${cured},
//         active=${active},
//         deaths=${deaths}
//     WHERE district_id = ${districtId};
//   `
//   await db.run(updateDistrictQuery)
//   response.send('District Details Updated')
// })

// app.get('/states/:stateId/stats/', async (request, response) => {
//   const {stateId} = request.params
//   const getstatsQuery = `
//     SELECT SUM(cases) AS cases,
//       SUM(cured) AS cured,
//       SUM(active) AS active,
//       SUM(deaths) AS deaths
//     FROM district
//     WHERE state_id= ${stateId};
//   `
//   const stateReport = await db.all(getstatsQuery)
//   response.send(reportSnakeToCamel(stateReport))
// })

// app.get('/districts/:districtId/details/', async (request, response) => {
//   const {districtId} = request.params
//   const getDistrictStateNameQuery = `
//     SELECT state_name
//     FROM state JOIN district
//          ON state.state_id = district.state_id
//     WHERE district.district_id = ${districtId};
//   `
//   const stateName = await db.get(getDistrictStateNameQuery)
//   response.send({stateName: stateName.state_name})
// })
module.exports = app
