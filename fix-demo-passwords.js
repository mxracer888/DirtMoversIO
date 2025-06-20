#!/usr/bin/env node

// Fix demo user passwords by regenerating correct bcrypt hashes
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function fixDemoPasswords() {
  console.log('🔧 Fixing demo user passwords...');
  
  try {
    // Generate new password hashes
    const brokerHash = await bcrypt.hash('broker123', 12);
    const driverHash = await bcrypt.hash('driver123', 12);
    
    console.log('Generated broker hash:', brokerHash);
    console.log('Generated driver hash:', driverHash);
    
    // Update broker password
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [brokerHash, 'sarah.broker@terrafirma.com']
    );
    
    // Update driver password
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [driverHash, 'mike.johnson@mountaintrucking.com']
    );
    
    console.log('✅ Demo passwords updated successfully');
    
    // Test the passwords
    const brokerUser = await pool.query('SELECT password FROM users WHERE email = $1', ['sarah.broker@terrafirma.com']);
    const driverUser = await pool.query('SELECT password FROM users WHERE email = $1', ['mike.johnson@mountaintrucking.com']);
    
    const brokerMatch = await bcrypt.compare('broker123', brokerUser.rows[0].password);
    const driverMatch = await bcrypt.compare('driver123', driverUser.rows[0].password);
    
    console.log('Broker password verification:', brokerMatch ? '✅ PASS' : '❌ FAIL');
    console.log('Driver password verification:', driverMatch ? '✅ PASS' : '❌ FAIL');
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  } finally {
    await pool.end();
  }
}

fixDemoPasswords();