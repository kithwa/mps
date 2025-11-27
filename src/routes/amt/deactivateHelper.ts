/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Maps Intel AMT Unprovision return values to appropriate HTTP status codes
 * for better client-side error handling
 */
export function mapUnprovisionReturnValueToHttpStatus(returnValue: number): number {
  switch (returnValue) {
    case 0: // SUCCESS
      return 200

    case 1: // NOT_PERMITTED - Operation not allowed (may need consent in CCM)
      return 403 // Forbidden

    case 2: // NOT_READY - System not ready
      return 503 // Service Unavailable

    case 36: // PERMISSION_DENIED - User consent required
      return 403 // Forbidden

    case 2056: // ALREADY_EXISTS - Already unprovisioned
      return 409 // Conflict

    default:
      return 400 // Bad Request for other errors
  }
}

/**
 * Provides user-friendly error messages based on AMT Unprovision return values
 */
export function getUnprovisionErrorMessage(
  returnValue: number,
  returnValueStr?: string
): {
  error: string
  message: string
  details: any
} {
  const actualReturnValueStr = returnValueStr ?? `Error code: ${returnValue}`

  switch (returnValue) {
    case 1: // NOT_PERMITTED
      return {
        error: 'Forbidden',
        message: 'Deactivation is not permitted. User consent may be required in CCM mode.',
        details: {
          returnValue,
          returnValueStr: actualReturnValueStr,
          suggestion: 'If device is in CCM mode, request and submit user consent code first',
          endpoints: {
            requestConsent: 'GET /api/v1/amt/userConsentCode/{guid}',
            submitConsent: 'POST /api/v1/amt/userConsentCode/{guid}'
          }
        }
      }

    case 2: // NOT_READY
      return {
        error: 'Service Unavailable',
        message: 'The system is not ready to process deactivation',
        details: {
          returnValue,
          returnValueStr: actualReturnValueStr,
          suggestion: 'Wait a few seconds and try again',
          retryAfter: 5
        }
      }

    case 36: // PERMISSION_DENIED
      return {
        error: 'Forbidden',
        message: 'Permission denied. User consent required for deactivation.',
        details: {
          returnValue,
          returnValueStr: actualReturnValueStr,
          suggestion: 'Request user consent code before deactivating',
          endpoints: {
            requestConsent: 'GET /api/v1/amt/userConsentCode/{guid}',
            submitConsent: 'POST /api/v1/amt/userConsentCode/{guid}'
          }
        }
      }

    case 2056: // ALREADY_EXISTS (already unprovisioned)
      return {
        error: 'Conflict',
        message: 'Device is already deactivated or not provisioned',
        details: {
          returnValue,
          returnValueStr: actualReturnValueStr,
          suggestion: 'Device may already be in unprovisioned state'
        }
      }

    default:
      return {
        error: 'Bad Request',
        message: `Deactivation failed: ${actualReturnValueStr}`,
        details: {
          returnValue,
          returnValueStr: actualReturnValueStr,
          suggestion: 'Check device state and try again'
        }
      }
  }
}
