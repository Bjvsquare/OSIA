const jwt = require('jsonwebtoken');
const secret = 'ousia-secret-key-2024-phoenix-trust';
const user = {
    id: '1769099927570',
    username: 'barendjvv@gmail.com',
    isAdmin: true,
    onboardingCompleted: true,
    name: 'Barend Jansen van Vuuren'
};

const token = jwt.sign({
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin
}, secret);

console.log('FORCE_LOGIN_DATA:');
console.log(JSON.stringify({ token, user }));
