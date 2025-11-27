/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Response, type Request } from 'express'
import { logger, messages } from '../../logging/index.js'
import { ErrorResponse } from '../../utils/amtHelper.js'
import { MqttProvider } from '../../utils/MqttProvider.js'
import { mapUnprovisionReturnValueToHttpStatus, getUnprovisionErrorMessage } from './deactivateHelper.js'

export async function deactivate(req: Request, res: Response): Promise<void> {
  try {
    const guid: string = req.params.guid

    const result = await req.deviceAction.unprovisionDevice()
    const returnValue = result.Body?.Unprovision_OUTPUT?.ReturnValue
    
    if (returnValue === 0) {
      // Success - delete device from database and secrets
      await req.db.devices.delete(guid, req.tenantId)
      await req.secrets.deleteSecretAtPath(`devices/${guid}`)
      MqttProvider.publishEvent('success', ['AMT_Unprovision'], 'Device successfully deactivated', guid)
      res.status(200).json({ 
        status: 'SUCCESS',
        message: 'Device successfully deactivated and removed'
      })
    } else {
      // Map AMT return value to appropriate HTTP status code
      const httpStatus = mapUnprovisionReturnValueToHttpStatus(returnValue)
      const errorDetail = getUnprovisionErrorMessage(returnValue, result.Body?.Unprovision_OUTPUT?.ReturnValueStr)
      
      logger.error(`${messages.UNPROVISION_EXCEPTION} for guid: ${guid}. ReturnValue: ${returnValue}`)
      MqttProvider.publishEvent('fail', ['AMT_Unprovision'], `Deactivation failed: ${errorDetail.message}`, guid)
      
      // Return detailed error response with original AMT data
      res.status(httpStatus).json({
        ...errorDetail,
        amtResponse: result.Body?.Unprovision_OUTPUT
      })
    }
  } catch (error) {
    logger.error(`${messages.UNPROVISION_EXCEPTION} : ${error}`)
    MqttProvider.publishEvent('fail', ['AMT_Unprovision'], messages.INTERNAL_SERVICE_ERROR)
    res.status(500).json(ErrorResponse(500, messages.UNPROVISION_EXCEPTION))
  }
}
