import { ElementId } from '@jbrowse/core/util/types/mst'
import { types } from 'mobx-state-tree'

const stateModel = types
  .model({
    id: ElementId,
    type: types.literal('ReactomeView'),
    displayName: types.maybe(types.string),
    selectedPathway: types.maybe(types.string),
    gene: types.maybe(types.string),
    message: 'No pathways are currently displayed.',
  })
  .volatile(() => ({
    pathways: undefined as unknown as object,
  }))
  .actions((self) => ({
    getSelectedPathway() {
      return self.selectedPathway
    },
    // unused but required by your view
    setWidth() {},
    setDisplayName(str: string) {
      self.displayName = str
    },
    setPathways(pathways: any) {
      self.pathways = pathways
    },
    setSelectedPathway(str: string) {
      self.selectedPathway = str
    },
    setGene(str: string) {
      self.gene = str
    },
    setMessage(str: string) {
      self.message = str
    },
  }))

export default stateModel
