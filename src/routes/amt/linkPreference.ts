/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Response, type Request } from 'express'
import { logger, messages } from '../../logging/index.js'
import { ErrorResponse } from '../../utils/amtHelper.js'
import { MqttProvider } from '../../utils/MqttProvider.js'
import { type DeviceAction } from '../../amt/DeviceAction.js'

export async function setLinkPreference(req: Request, res: Response): Promise<void> {
  try {
    const guid: string = req.params.guid
    const linkPreference: number = Number(req.body.linkPreference)
    const timeout: number = Number(req.body.timeout)
    const instanceID: string | undefined = req.query.instanceID as string
    const deviceAction: DeviceAction = req.deviceAction as DeviceAction

    const linkPrefName = linkPreference === 1 ? 'ME' : 'HOST'
    const instanceIDParam = instanceID?.trim() === '' ? undefined : instanceID
    logger.debug(`Set Link Preference to ${linkPrefName} for ${guid} with timeout ${timeout}s, instanceID: ${instanceIDParam ?? 'auto-detect'}`)
    
    const result = await deviceAction.setEthernetLinkPreference(linkPreference as 1 | 2, timeout, instanceIDParam)
    
    // Check if validation failed (non-WiFi port or no WiFi port found)
    if (result?.Body?.Fault != null) {
      const errorMsg = result.Body.Fault.Reason?.Text ?? 'Validation failed'
      logger.error(`Set Link Preference validation failed: ${errorMsg}`)
      MqttProvider.publishEvent('fail', ['AMT_LinkPreference'], errorMsg)
      res.status(400).json({ error: errorMsg }).end()
      return
    }

    // Check if result is null (port not found or other error)
    if (result == null) {
      logger.error('Set Link Preference failed: port validation failed')
      MqttProvider.publishEvent('fail', ['AMT_LinkPreference'], 'Port validation failed')
      res.status(500).json(ErrorResponse(500, 'Failed to validate ethernet port')).end()
      return
    }

    // Extract the detected instanceID (if auto-detected)
    const detectedInstanceID = (result as any)._detectedInstanceID ?? instanceIDParam ?? 'Unknown'

    MqttProvider.publishEvent('success', ['AMT_LinkPreference'], `Link Preference set to ${linkPrefName}`)
    res.status(200).json({ 
      status: `Link Preference set to ${linkPrefName}`, 
      linkPreference,
      timeout, 
      instanceID: detectedInstanceID
    }).end()
  } catch (error) {
    logger.error(`Exception during Set Link Preference: ${error}`)
    MqttProvider.publishEvent('fail', ['AMT_LinkPreference'], messages.INTERNAL_SERVICE_ERROR)
    res.status(500).json(ErrorResponse(500, 'Exception during Set Link Preference')).end()
  }
}
