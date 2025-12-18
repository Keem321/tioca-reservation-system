// MongoDB Playground file for TIOCA Reservation System
// Create database and hotels collection with sample data

use('tioca-reservation-system')

db.createCollection('hotels')

db.hotels.insertMany([
  {
    name: 'TIOCA Inn',
    address: '123 Herbal Lane, Green City',
    phone: '555-1234',
    category: 'hotel',
    amenities: ['WiFi', 'Breakfast', 'Pool'],
    managerId: null
  },
  {
    name: 'TeaOCA Suites',
    address: '456 Blossom Rd, Flower Town',
    phone: '555-5678',
    category: 'hotel',
    amenities: ['Spa', 'Parking', 'Gym'],
    managerId: null
  }
])
