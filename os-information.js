// const  os  =  require('os'); 
// const path = require('path')
// const  fs  =  require('fs'); 
// const  zlib  =  require('zlib'); 
// console.log("🦜 zlib", zlib);



// fs.readFile('example.txt',  'utf8',  (err,  data)  =>  { 
// if (err) throw err; 
// console.log(data); 
// }); 

// console.log('Platform:',  os.platform()); 
// console.log('Architecture:',  os.arch()); 
// console.log('Uptime  (seconds):',  os.uptime());

// console.log('CPU  Info:',  os.cpus()); 


const  v8  =  require('v8'); 
const  cluster  =  require('cluster'); 
console.log("🔮 cluster", cluster);

console.log(v8.getHeapStatistics()); 