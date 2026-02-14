import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
   ext: {  
    loadimpact: {  
      distribution: {  
        'amazon:ie:dublin': { loadZone: 'amazon:ie:dublin', percent: 100 },  //Nur Cloud, sonst wirds ingoriert
      },  
    },  
  },  
  stages: [
    { duration: '0.5m', target: 100 }, // Ramp-up auf 100 Nutzer
    { duration: '1.5m', target: 100 }, // Haltephase
    { duration: '0.5m', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% unter 800ms
  },
};

export default function () {
  const res = http.get('https://ticketsystemspa-cmhdbkcbexbgbhbj.switzerlandnorth-01.azurewebsites.net/');
  check(res, { 'Status ist 200': (r) => r.status === 200 });
  sleep(1);
}
