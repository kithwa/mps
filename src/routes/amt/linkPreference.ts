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
    const timeout: number = Number(req.body.timeout)
    const instanceID: string | undefined = req.body.instanceID
    const deviceAction: DeviceAction = req.deviceAction as DeviceAction

    logger.debug(`Set Link Preference to ME for ${guid} with timeout ${timeout}s, instanceID: ${instanceID ?? 'default'}`)
    await deviceAction.setLinkPreferenceME(timeout, instanceID)
    MqttProvider.publishEvent('success', ['AMT_LinkPreference'], 'Link Preference set to ME')
    res.status(200).json({ status: 'Link Preference set to ME', timeout, instanceID: instanceID ?? 'Intel(r) AMT Ethernet Port Settings 0' }).end()
  } catch (error) {
    logger.error(`Exception during Set Link Preference: ${error}`)
    MqttProvider.publishEvent('fail', ['AMT_LinkPreference'], messages.INTERNAL_SERVICE_ERROR)
    res.status(500).json(ErrorResponse(500, 'Exception during Set Link Preference')).end()
  }
}

export async function cancelLinkPreference(req: Request, res: Response): Promise<void> {
  try {
    const guid: string = req.params.guid
    const instanceID: string | undefined = req.query.instanceID as string
    const deviceAction: DeviceAction = req.deviceAction as DeviceAction

    logger.debug(`Cancel Link Preference; revert to HOST for ${guid}, instanceID: ${instanceID ?? 'default'}`)
    await deviceAction.cancelLinkPreference(instanceID)
    MqttProvider.publishEvent('success', ['AMT_LinkPreference'], 'Link Preference reverted to HOST')
    res.status(200).json({ status: 'Link Preference reverted to HOST', instanceID: instanceID ?? 'Intel(r) AMT Ethernet Port Settings 0' }).end()
  } catch (error) {
    logger.error(`Exception during Cancel Link Preference: ${error}`)
    MqttProvider.publishEvent('fail', ['AMT_LinkPreference'], messages.INTERNAL_SERVICE_ERROR)
    res.status(500).json(ErrorResponse(500, 'Exception during Cancel Link Preference')).end()
  }
}

