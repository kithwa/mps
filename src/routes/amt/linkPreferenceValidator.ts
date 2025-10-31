/*********************************************************************
 * Copyright (c) Intel Corporation 2025
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { check } from 'express-validator'

export const linkPreferenceValidator = (): any => [
  check('timeout').isInt({ min: 0 })
]

