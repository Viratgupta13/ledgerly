declare module 'react-native-get-sms-android' {
  type Fail = (error: string) => void;
  type Success = (count: number, smsListJson: string) => void;
  const SmsAndroid: {
    list(filterJson: string, fail: Fail, success: Success): void;
  };
  export default SmsAndroid;
}
