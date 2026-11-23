const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'cars.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    price REAL NOT NULL,
    horsepower INTEGER,
    fuel TEXT,
    transmission TEXT,
    image TEXT
  )
`);

const sampleCars = [
  ['BMW', 'M4 Competition', 2024, 85000, 510, 'Petrol', 'Automatic', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80'],
  ['Mercedes-Benz', 'C63 AMG', 2023, 95000, 503, 'Petrol', 'Automatic', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80'],
  ['Porsche', '911 Carrera', 2024, 120000, 388, 'Petrol', 'Automatic', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'],
  ['Audi', 'RS7 Performance', 2025, 125000, 630, 'Petrol', 'Automatic', 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80'],
  ['Lamborghini', 'Huracan EVO', 2023, 260000, 640, 'Petrol', 'Automatic', 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80'],
  ['Ferrari', 'F8 Tributo', 2022, 280000, 710, 'Petrol', 'Automatic', 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=80'],
];

const existingCars = new Set(
  db.prepare('SELECT brand, model FROM cars')
    .all()
    .map(({ brand, model }) => JSON.stringify([brand, model]))
);
const insertCar = db.prepare(`
  INSERT INTO cars (brand, model, year, price, horsepower, fuel, transmission, image)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const seedMissingCars = db.transaction(() => {
  for (const car of sampleCars) {
    const key = JSON.stringify([car[0], car[1]]);
    if (!existingCars.has(key)) {
      insertCar.run(...car);
      existingCars.add(key);
    }
  }
});

seedMissingCars();
console.log(`Connected to SQLite database at ${dbPath}.`);

module.exports = db;
