/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { check, query } from 'express-validator'

export const linkPreferenceValidator = (): any => [
  check('timeout').isInt({ min: 0 }),
  query('instanceID').optional().isString()
]

