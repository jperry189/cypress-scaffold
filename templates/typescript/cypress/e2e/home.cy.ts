describe('Cypress example site', () => {
  it('loads the home page and a commands page', () => {
    cy.visit('/');
    cy.contains('Kitchen Sink').should('be.visible');
    cy.visit('/commands/querying');
    cy.location('pathname').should('eq', '/commands/querying');
    cy.contains('h1', 'Querying').should('be.visible');
  });
});
