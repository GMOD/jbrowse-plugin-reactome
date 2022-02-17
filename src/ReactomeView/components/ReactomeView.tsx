import React, { useEffect, useState, useRef } from 'react'
import { observer } from 'mobx-react'
import domLoadScript from 'load-script2'
import {
  Grid,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Box,
  Typography,
  makeStyles,
} from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import SearchIcon from '@material-ui/icons/Search'
import { FixedSizeList } from 'react-window'

const useStyles = makeStyles(() => ({
  pathwayDisplay: {
    backgroundColor: '#f7f7f7',
    border: '1px solid #ddd',
  },
  listItem: {
    borderBottom: '1px solid #ccc',
    borderRight: '1px solid #ccc',
    padding: '8px 16px',
  },
  selectedLi: {
    borderBottom: '1px solid #ccc',
    borderRight: '1px solid #ccc',
    padding: '8px 16px',
    backgroundColor: 'e8e8e8',
    boxShadow: 'inset -4px 0px 0px 0px green',
  },
}))

async function fetchPathways(geneName: string) {
  const response = await fetch(
    `https://idg.reactome.org/idgpairwise/relationships/hierarchyForTerm/${geneName}`,
    {
      method: 'GET',
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch ${response.status} ${response.statusText}`)
  }
  return response.json()
}

async function getPathways(geneName: string) {
  const response = await fetchPathways(geneName)

  let pathways: any = []

  const recurse = (element: any) => {
    pathways = [...pathways, { stId: element.stId, name: element.name }]

    if (Array.isArray(element.children)) {
      element.children.map((ele: any) => recurse(ele))
    }
  }

  response.hierarchy.map((element: any) => {
    return recurse(element)
  })

  return pathways
}

function onReactomeDiagramReady() {
  // @ts-ignore
  var diagram = window.Reactome.Diagram.create({
    placeHolder: 'diagramHolder',
    width: 950, // minimum recommended width
    height: 500,
    toHide: ['search'],
  })

  diagram.loadDiagram('R-HSA-1266738')

  return diagram
}

async function handleOpen(setDiagram: any) {
  await domLoadScript(
    'https://dev.reactome.org/DiagramJs/diagram/diagram.nocache.js',
  )

  await new Promise((resolve) => {
    let checker = setInterval(() => {
      // @ts-ignore
      if (window.Reactome) {
        clearInterval(checker)
        // @ts-ignore
        resolve(window.Reactome)
      }
    }, 100)
  })

  setDiagram(onReactomeDiagramReady())
}

const ReactomeView = observer(({ model }: { model: any }) => {
  const inputRef = useRef()
  const [pathwayDisplayMessage, setPathwayDisplayMessage] = useState(
    'No pathways are currently displayed.',
  )
  const [pathwayCount, setPathwayCount] = useState(
    model.pathways?.length ? model.pathways.length : 0,
  )
  const [diagram, setDiagram] = useState<any>()
  const [reqGene, setReqGene] = useState<String>()
  const [selectedLi, setSelectedLi] = useState<String>()
  const classes = useStyles()

  useEffect(() => {
    handleOpen(setDiagram)
  }, [])

  const selectPathway = (id: any, gene: any) => {
    if (diagram) {
      diagram.loadDiagram(id)
      diagram.flagItems(gene)
    }
  }

  function renderRow(props: any) {
    const { index, style } = props
    if (model.pathways[index]?.stId === selectedLi) {
      return (
        <ListItem
          button
          style={style}
          className={classes.selectedLi}
          key={index}
          onClick={() => {
            selectPathway(model.pathways[index]?.stId, reqGene)
            setSelectedLi(model.pathways[index]?.stId)
          }}
        >
          <ListItemText
            primary={model.pathways[index]?.stId}
            secondary={model.pathways[index]?.name}
          />
        </ListItem>
      )
    }
    return (
      <ListItem
        button
        style={style}
        className={classes.listItem}
        key={index}
        onClick={() => {
          selectPathway(model.pathways[index]?.stId, reqGene)
          setSelectedLi(model.pathways[index]?.stId)
        }}
      >
        <ListItemText
          primary={model.pathways[index]?.stId}
          secondary={model.pathways[index]?.name}
        />
      </ListItem>
    )
  }

  const handleSubmit = async () => {
    // @ts-ignore
    const requestedGeneName = inputRef ? inputRef.current.value : undefined
    setReqGene(requestedGeneName)

    if (requestedGeneName) {
      const pathways = await getPathways(requestedGeneName)

      if (pathways?.length !== 0) {
        model.setPathways(pathways)
        setPathwayCount(model.pathways.length)
        setPathwayDisplayMessage(
          `Pathways relating to ${requestedGeneName} are being displayed. Click on the pathway name to display it in the Reactome Diagram viewer.`,
        )
        selectPathway(model.pathways[0].stId, requestedGeneName)
      } else {
        model.setPathways([])
        setPathwayCount(0)
        setPathwayDisplayMessage(
          `No pathways could be retrieved for ${requestedGeneName}.`,
        )
      }
    }

    // @ts-ignore
    inputRef.current.value = null
  }

  const SearchButton = () => {
    return (
      <IconButton onClick={handleSubmit}>
        <SearchIcon />
      </IconButton>
    )
  }

  return (
    <div>
      <Grid
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
        style={{ gap: '5px' }}
      >
        <TextField
          fullWidth
          color="primary"
          variant="outlined"
          label="Enter a gene name to retrieve associated pathways"
          InputProps={{ endAdornment: <SearchButton /> }}
          style={{ width: 625 }}
          inputRef={inputRef}
          onKeyPress={(e: any) => {
            if (e.key === 'Enter') handleSubmit()
          }}
        />
        <Alert severity="info" style={{ width: 1250 }}>
          {pathwayDisplayMessage}
        </Alert>
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          style={{ gap: '5px', marginBottom: '8px' }}
        >
          {pathwayCount ? (
            <FixedSizeList
              height={500}
              width={300}
              itemSize={56}
              itemCount={pathwayCount}
              className={classes.pathwayDisplay}
            >
              {renderRow}
            </FixedSizeList>
          ) : (
            <Box className={classes.pathwayDisplay} height={500} width={300}>
              <Typography align="center">
                There are no pathways to be displayed.
              </Typography>
            </Box>
          )}
          <div id="diagramHolder"></div>
        </Grid>
      </Grid>
    </div>
  )
})

export default ReactomeView
