const bcrypt = require('bcryptjs');
const start = Date.now();
console.log('Starting bcrypt compare...');
bcrypt.compare('test', '$2b$10$xktYFaPJwTkAhP3PanfKf.syb56MwA8L6v5XCVRLl1/WGJMeWT0AO').then(res => {
    console.log(`Bcrypt compare finished in ${Date.now() - start}ms. Result: ${res}`);
}).catch(err => {
    console.error('Bcrypt error:', err);
});
