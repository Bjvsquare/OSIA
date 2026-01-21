const bcrypt = require('bcryptjs');
const hash = '$2b$10$EKDnqYATt00M71OPc4hKa.KGoHo1zFb5P8Jz5FQ5d40Suyrc168Xm';
const pass = 'test';

console.log('Testing bcrypt compare for mmwbotha...');
const start = Date.now();
bcrypt.compare(pass, hash).then(res => {
    console.log(`Result: ${res} (took ${Date.now() - start}ms)`);
}).catch(err => {
    console.error('Error:', err);
});
