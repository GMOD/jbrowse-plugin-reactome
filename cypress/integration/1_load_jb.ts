describe('load jb', () => {
  it('visits JBrowse', () => {
    cy.visit('http://localhost:3000/?config=http://localhost:8999/config.json')

    // The splash screen successfully loads
    cy.contains('Start a new session')
  })
})
