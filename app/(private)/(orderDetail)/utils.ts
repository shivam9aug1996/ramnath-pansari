export const calculateSavingsAndFreebies = (items: any[]) => {
  let totalOriginalPrice = 0;
  let freebieValue = 0;
  const freebies: Array<{ name: string; quantity: number; value: number }> = [];

  items?.forEach(item => {
    const  price = item?.productDetails?.price;
    const discountedPrice = item?.productDetails?.discountedPrice;
    const quantity = item.quantity;
    
    // Calculate original price for this item
    const itemOriginalPrice = price * quantity;
    
    // If item is free (discountedPrice is 0)
    if (discountedPrice === 0) {
      freebieValue += itemOriginalPrice;
      freebies.push({
        name: item.productDetails.name,
        quantity: item.quantity,
        value: itemOriginalPrice,
        image: item.productDetails.image
      });
    } else {
      totalOriginalPrice += itemOriginalPrice;
    }
  });

  return {
    totalOriginalPrice, // Price without freebies
    freebieValue,      // Value of free items
    freebies          // Array of free items with their details
  };
};

export const getStatusStyle = (status: string) => {
  const statusLower = status?.toLowerCase();
  switch (statusLower) {
    case 'confirmed':
      return {
        backgroundColor: '#E0F7FA',
        iconColor: '#00ACC1',
        textColor: '#00838F',
        icon: 'checkbox-marked-circle-outline'
      };
    case 'out_for_delivery':
      return {
        backgroundColor: '#FFF7CD',
        iconColor: '#FFB300',
        textColor: '#F57F17',
        icon: 'truck-delivery'
      };
    case 'delivered':
      return {
        backgroundColor: '#EBF4F1',
        iconColor: '#2E7D32',
        textColor: '#1B5E20',
        icon: 'package-variant-closed'
      };
    case 'canceled':
      return {
        backgroundColor: '#F8ECEC',
        iconColor: '#D32F2F',
        textColor: '#B71C1C',
        icon: 'close-circle'
      };
    default:
      return {
        backgroundColor: '#F5F5F5',
        iconColor: '#757575',
        textColor: '#616161',
        icon: 'information'
      };
  }
};