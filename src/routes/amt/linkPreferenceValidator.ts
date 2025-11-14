/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { check, query } from 'express-validator'

// Note: timeout parameter is only functional when linkPreference is ME (1)
// When linkPreference is HOST (2), timeout is automatically ignored
export const linkPreferenceValidator = (): any => [
  check('linkPreference').isInt({ min: 1, max: 2 }).withMessage('linkPreference must be 1 (ME) or 2 (HOST)'),
  check('timeout').isInt({ min: 0 }).withMessage('timeout must be a non-negative integer'),
  query('instanceID').optional().isString()
]

