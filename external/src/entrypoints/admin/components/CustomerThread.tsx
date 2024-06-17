import type { UUID } from 'common/types/index.ts';
import { ADMIN_ORIGIN } from 'common/const/Urls.ts';

export function CustomerThread({ id }: { id: UUID }) {
  return (
    <iframe
      src={`${ADMIN_ORIGIN}/customer-thread.html?id=${id}`}
      style={{ height: '90vh', width: '100%', border: '0px' }}
    ></iframe>
  );
}
