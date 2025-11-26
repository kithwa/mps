/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

/**
 * Maps Intel AMT return values to appropriate HTTP status codes
 * for better client-side error handling
 */
export function mapAMTReturnValueToHttpStatus(returnValue: number, operation: 'request' | 'send' | 'cancel'): number {
  switch (returnValue) {
    case 0: // PT_STATUS_SUCCESS
      return 200

    case 2: // NOT_READY - Operation already in progress
      return operation === 'request' ? 409 : 503 // Conflict or Service Unavailable

    case 3: // PT_STATUS_INVALID_NAME
      return 400 // Bad Request

    case 4: // PT_STATUS_INVALID_PARAM - Wrong consent code
    case 3080: // PT_STATUS_INVALID_PARAM
      return 422 // Unprocessable Entity

    case 1: // PT_STATUS_INTERNAL_ERROR
      return 500 // Internal Server Error

    default:
      return 400 // Bad Request for other errors
  }
}

/**
 * Provides user-friendly error messages based on AMT return values
 */
export function getDetailedErrorMessage(
  returnValue: number,
  returnValueStr: string,
  operation: 'request' | 'send' | 'cancel'
): {
  error: string
  message: string
  details: any
} {
  switch (returnValue) {
    case 2: // NOT_READY
      if (operation === 'request') {
        return {
          error: 'Conflict',
          message: 'A consent request is already pending or the system is not ready',
          details: {
            returnValue,
            returnValueStr,
            suggestion: 'Cancel the existing request first using: GET /api/v1/amt/userConsentCode/cancel/{guid}',
            retryAfter: 'Wait 5-10 seconds or cancel the pending request'
          }
        }
      } else if (operation === 'send') {
        return {
          error: 'Service Unavailable',
          message: 'The consent code has expired or no request is pending',
          details: {
            returnValue,
            returnValueStr,
            suggestion: 'Request a new consent code using: GET /api/v1/amt/userConsentCode/{guid}'
          }
        }
      } else {
        return {
          error: 'Service Unavailable',
          message: 'System not ready to cancel consent request',
          details: {
            returnValue,
            returnValueStr
          }
        }
      }

    case 4:
    case 3080: // Invalid consent code
      return {
        error: 'Unprocessable Entity',
        message: 'Invalid consent code provided',
        details: {
          returnValue,
          returnValueStr,
          suggestion: 'Verify the 6-digit code displayed on the device screen and try again'
        }
      }

    case 1: // Internal error
      return {
        error: 'Internal Server Error',
        message: 'AMT internal error occurred',
        details: {
          returnValue,
          returnValueStr
        }
      }

    case 3: // Invalid name/parameter
      return {
        error: 'Bad Request',
        message: 'Invalid parameter provided',
        details: {
          returnValue,
          returnValueStr
        }
      }

    default:
      return {
        error: 'Bad Request',
        message: `Operation failed: ${returnValueStr}`,
        details: {
          returnValue,
          returnValueStr
        }
      }
  }
}
