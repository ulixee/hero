const fs = require('fs');

module.exports = async () => {
  fs.rmdirSync(`${__dirname}/.cache-test`, { recursive:true });  
};
