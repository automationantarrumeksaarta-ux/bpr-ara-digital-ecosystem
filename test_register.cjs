const fetch = require('node-fetch');

async function run() {
  // 1. Send OTP
  console.log("Sending OTP...");
  const sendRes = await fetch('http://localhost:3535/api/auth/send-otp', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ email: 'test_otp@example.com', name: 'Test OTP', username: 'testotp' })
  });
  console.log("Send OTP Res:", await sendRes.text());

  // 2. Query DB to get the OTP
  const { execSync } = require('child_process');
  const out = execSync('sqlite3 data/bpr_ara.sqlite "SELECT otp_code FROM otp_verifications WHERE email=\'test_otp@example.com\';"');
  const otpCode = out.toString().trim();
  console.log("Got OTP from DB:", otpCode);

  // 3. Register
  console.log("Registering...");
  const regRes = await fetch('http://localhost:3535/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'test_otp@example.com',
      name: 'Test OTP',
      username: 'testotp',
      password: '123',
      roleTier: 'LOW',
      unit: 'BIS',
      otpCode: otpCode
    })
  });
  console.log("Register Res:", await regRes.text());
}

run().catch(console.error);
