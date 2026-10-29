describe('Cypress example site', () => {
  it('loads the home page and opens the commands page', () => {
    cy.visit('/');
    cy.contains('Kitchen Sink').should('be.visible');
    cy.contains('a', 'Commands').click();
    cy.location('pathname').should('include', '/commands');
    cy.contains('h1', 'Commands').should('be.visible');
  });
});
