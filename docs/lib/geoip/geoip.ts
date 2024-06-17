import Env from 'server/src/config/Env.ts';

export async function ipToLocation(ip: string): Promise<string> {
  if (ip === '80.249.216.101') {
    return 'Cord Office';
  }

  if (!Env.IPSTACK_API_SECRET) {
    return ip;
  }

  const resp = await fetch(
    'https://api.ipstack.com/' + ip + '?access_key=' + Env.IPSTACK_API_SECRET,
    {
      method: 'GET',
    },
  );
  const json = await resp.json();

  if (
    json &&
    typeof json === 'object' &&
    'country_code' in json &&
    'city' in json &&
    typeof json.country_code === 'string' &&
    typeof json.city === 'string'
  ) {
    return json.city + ', ' + json.country_code;
  }

  return ip;
}
