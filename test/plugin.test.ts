import fs from 'node:fs'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  cleanupJBrowse,
  createJBrowsePage,
  launchBrowser,
  setupJBrowse,
  startJBrowseServer,
  stopServer,
  waitForJBrowseLoad,
} from './setup'

import type { ChildProcess } from 'node:child_process'
import type { Browser, Page } from 'puppeteer'

const JBROWSE_VERSION = process.env.TEST_JBROWSE_VERSION || 'nightly'
const GENE_INPUT =
  '::-p-aria(Enter a gene name to retrieve associated pathways)'
const SCREENSHOT_DIR = path.join('test-screenshots', JBROWSE_VERSION)

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

function screenshot(name: string) {
  return path.join(SCREENSHOT_DIR, `${name}.png`)
}

describe('Reactome plugin E2E', () => {
  let server: ChildProcess | undefined
  let browser: Browser | undefined
  let page: Page | undefined
  const pageErrors: string[] = []

  beforeAll(async () => {
    setupJBrowse()
    server = await startJBrowseServer()
    browser = await launchBrowser()
    page = await createJBrowsePage(browser)
    page.on('pageerror', err => {
      pageErrors.push(String(err))
    })
    await waitForJBrowseLoad(page)
  }, 180_000)

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
    if (server) {
      await stopServer(server)
    }
    await cleanupJBrowse()
  })

  it('opens the Reactome view from the default session', async () => {
    await page!.waitForSelector(GENE_INPUT, { timeout: 30_000 })
    expect(pageErrors).toEqual([])
  }, 60_000)

  it('lists pathways for a gene and draws the selected one', async () => {
    const diagramData = page!.waitForResponse(
      response => /\/diagram\/R-HSA-\d+\.graph\.json/.test(response.url()),
      { timeout: 60_000 },
    )
    await page!.type(GENE_INPUT, 'TP53')
    await page!.keyboard.press('Enter')
    await page!.waitForSelector('::-p-text(R-HSA-69895)', {
      timeout: 30_000,
    })
    await diagramData
    await page!.waitForNetworkIdle({ timeout: 60_000 })
    await page!.screenshot({ path: screenshot('tp53-pathways') })
    expect(pageErrors).toEqual([])
  }, 120_000)
})
