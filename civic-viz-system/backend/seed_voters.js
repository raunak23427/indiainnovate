const db = require('./db');

const testVoters = [];
for (let i = 1; i <= 10; i++) {
  testVoters.push({
    voter_id: `VOTER10${i}`,
    name: `Test Citizen ${i}`,
    father_name: `Father ${i}`,
    house_no: `House ${i}, ZN1-CL1 Area`,
    age: 25 + i,
    gender: i % 2 === 0 ? 'F' : 'M',
    booth_id: 'Z01-DWA-C01-B01',
    area: 'Dwarka'
  });
}

const insert = db.prepare(`
  INSERT OR REPLACE INTO voters (voter_id, name, father_name, house_no, age, gender, booth_id, area)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((voters) => {
  for (const v of voters) {
    insert.run(v.voter_id, v.name, v.father_name, v.house_no, v.age, v.gender, v.booth_id, v.area);
  }
});

try {
  insertMany(testVoters);
  console.log("10 predefined test voters inserted successfully!");
} catch (err) {
  console.error("Error inserting test voters:", err.message);
}
