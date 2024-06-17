import { makeCustomerName } from 'server/src/console/utils.ts';

describe('Customer name from email util', () => {
  test('Gets and capitalises normal domain', () => {
    expect(makeCustomerName('rolo@cord.com')).toEqual('Cord');
  });
  test('Uses pre-@ for common/free domain', () => {
    expect(makeCustomerName('rolo@hotmail.com')).toEqual('rolo');
    expect(makeCustomerName('rolo@gmail.com')).toEqual('rolo');
    expect(makeCustomerName('rolo@yahoo.com')).toEqual('rolo');
  });
  test('Uses whole email for odd input', () => {
    expect(makeCustomerName('weirdstringhowdidthishappen')).toEqual(
      'weirdstringhowdidthishappen',
    );
  });
  test('Works for more subdomains', () => {
    expect(makeCustomerName('rolo@cord.co.uk')).toEqual('Cord');
  });
});
