describe('load conf', () => {
  it('visits JBrowse Reactome session', () => {
    cy.exec('shx cp cypress/fixtures/reactome_session.json .jbrowse')
    cy.visit('/?config=config.json&session=reactome_session.json')

    // The plugin successfully loads
    cy.contains('Add').click()
    cy.contains('Reactome View').click()
    cy.contains('Reactome View')
  })
})
