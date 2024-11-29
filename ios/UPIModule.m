#import "UPIModule.h"
#import <React/RCTLog.h>

@implementation UPIModule

// Export the module
RCT_EXPORT_MODULE(UPIModule);

// Export a simple logging method
RCT_EXPORT_METHOD(logMessage:(NSString *)message)
{
    RCTLogInfo(@"React Native Log: %@", message);
}

@end
