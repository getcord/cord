import { Helmet } from 'react-helmet';
import { WhoisInput } from 'external/src/entrypoints/admin/components/WhoisInput.tsx';
import { JWTDecode } from 'external/src/entrypoints/admin/components/JWTDecode.tsx';

export function Whois() {
  return (
    <>
      <Helmet>
        <title>Cord Admin - Who dis?</title>
      </Helmet>

      <WhoisInput
        inputLabel="Customer ID"
        buttonLabel="Who's paying?"
        pathType="customer"
      />
      <WhoisInput
        inputLabel="App ID"
        buttonLabel="What app'ened?"
        pathType="application"
      />
      <WhoisInput
        inputLabel="Org ID"
        buttonLabel="What the org"
        pathType="org"
      />
      <WhoisInput inputLabel="User ID" buttonLabel="Who dis?" pathType="user" />
      <WhoisInput
        inputLabel="Thread ID"
        buttonLabel="What'd y'all say?"
        pathType="thread"
      />
      <WhoisInput
        inputLabel="Message ID"
        buttonLabel="What'd you say?"
        pathType="message"
      />
      <WhoisInput
        inputLabel="???"
        buttonLabel="Rolo, go sniff it out!"
        pathType="idsearch"
      />
      <hr />

      <JWTDecode />
    </>
  );
}
