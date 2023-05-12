// eslint-disable-next-line import/prefer-default-export
export enum Action {
  email = 'email',
  phone = 'phone',
}

export enum ActionCode {
  email_code = 'email_code',
  phone_code = 'phone_code',
}

export enum ActionByActionCode {
  email_code = 'email',
  phone_code = 'phone',
}

export enum ActionCodeByAction {
  email = 'email_code',
  phone = 'phone_code',
}
