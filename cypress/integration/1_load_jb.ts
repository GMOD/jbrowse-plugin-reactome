describe('load jb', () => {
  it('visits JBrowse', () => {
    cy.visit('/')

    // The splash screen successfully loads
    cy.contains('Start a new session')
  })
})
