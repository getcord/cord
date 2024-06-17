import { generateToken } from 'utils';

describe('Sdk test flow', () => {
  const host = Cypress.env('HOST') ?? 'https://local.cord.com:8123';
  const signingSecret = Cypress.env('TEST_APP_SECRET');

  if (!signingSecret) {
    throw new Error('No signing secret found 😿');
  }

  const token = generateToken(
    'dfa86152-9e7e-4d2d-acd6-bfddef71f58e', // Cord Automated Tests app id
    signingSecret,
  );

  it('Can load sdk sidebar and send a message', () => {
    cy.visit(`${host}/tests/index.html`);

    cy.window()
      .then((window) => window.localStorage.setItem('testToken', token))
      .then(() => {
        cy.reload();

        // Can see an automatically produced sample message
        cy.get('[data-cy="cord-conversation-screen"]').within(() => {
          cy.get('[data-cy="cord-message"]');
        });

        const myMessage = 'Hey Alberto!!!';

        // NB this is assuming there is only one thread on the page - which should be the case
        cy.get('[data-cy="cord-thread"]').click();
        cy.get('[data-cy="cord-composer"]').click().type(`${myMessage}{enter}`);

        // Check that the message now appears in the thread
        cy.get('[data-cy="cord-full-page-thread"]').within(() => {
          cy.get('[data-cy="cord-message"]').contains(myMessage);
        });

        // Check message has persisted (it wasn't just optimistically rendered)
        // The first page visit should save the token to local storage so it should
        // reload as the same user
        // NB still assuming there is only one thread
        cy.reload();
        cy.get('[data-cy="cord-thread"]').click();
        cy.get('[data-cy="cord-full-page-thread"]').within(() => {
          cy.get('[data-cy="cord-message"]').contains(myMessage);
        });
      });
  });
});
