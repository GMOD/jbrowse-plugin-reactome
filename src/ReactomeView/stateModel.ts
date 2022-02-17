import { types } from 'mobx-state-tree'

const stateModel = types
  .model({
    type: types.literal('ReactomeView'),
    displayName: types.maybe(types.string),
  })
  .volatile(() => ({
    pathways: undefined as unknown as object,
  }))
  .actions((self) => ({
    // unused but required by your view
    setWidth() {},
    setDisplayName(str: string) {
      self.displayName = str
    },
    setPathways(pathways: any) {
      self.pathways = pathways
    },
  }))

export default stateModel
