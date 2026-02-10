const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@gmail.com',
            password: 'Admin1234'
        });
        console.log('Login Response User Role:', response.data.user.role);
        if (response.data.user.role === 'SUPER_ADMIN') {
            console.log('✅ TEST PASSED: Role is SUPER_ADMIN');
        } else {
            console.error('❌ TEST FAILED: Role is ' + response.data.user.role);
        }
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
}

testLogin();
