import React from 'react'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import ReactomeView from '../src/ReactomeView/components/ReactomeView'
import stateModel from '../src/ReactomeView/stateModel'

const loadDiagram = vi.fn()

vi.mock('../src/ReactomeView/reactomeApi', async importOriginal => ({
  ...(await importOriginal<object>()),
  loadDiagramJs: () =>
    Promise.resolve({ Diagram: { create: () => ({ loadDiagram }) } }),
}))

const hierarchy = [
  {
    stId: 'R-HSA-1643685',
    name: 'Disease',
    children: [
      { stId: 'R-HSA-5663202', name: 'Diseases of signal transduction' },
    ],
  },
  { stId: 'R-HSA-1640170', name: 'Cell Cycle' },
]

beforeEach(() => {
  loadDiagram.mockClear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ hierarchy }))),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('lists every pathway, draws the most specific one, then the one clicked', async () => {
  const model = stateModel.create({ id: 'view', type: 'ReactomeView' })
  render(<ReactomeView model={model} />)

  const input = screen.getByLabelText(/gene name/)
  fireEvent.change(input, { target: { value: 'TP53' } })
  fireEvent.keyDown(input, { key: 'Enter' })

  await screen.findByText('Diseases of signal transduction')
  expect(screen.getAllByRole('button', { name: /R-HSA/ })).toHaveLength(3)
  await waitFor(() => {
    expect(loadDiagram).toHaveBeenLastCalledWith('R-HSA-5663202')
  })

  fireEvent.click(screen.getByText('Cell Cycle'))
  await waitFor(() => {
    expect(loadDiagram).toHaveBeenLastCalledWith('R-HSA-1640170')
  })
  expect(model.message).toContain('"Cell Cycle" has been selected')
})

it('says so when a gene has no pathways', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ hierarchy: [] }))),
  )
  const model = stateModel.create({ id: 'view', type: 'ReactomeView' })
  render(<ReactomeView model={model} />)

  const input = screen.getByLabelText(/gene name/)
  fireEvent.change(input, { target: { value: 'NOTAGENE' } })
  fireEvent.keyDown(input, { key: 'Enter' })

  await screen.findByText('No pathways could be retrieved for NOTAGENE.')
  expect(
    screen.getByText('There are no pathways to be displayed.'),
  ).toBeTruthy()
})
