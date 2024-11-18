import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import {
  INotificationModuleService,
  IOrderModuleService,
  IProductModuleService,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function BlenderCategoryOrderHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log("BlenderCategoryOrderHandler triggered. Order ID:", data.id);

  // Resolve services
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  );
  const productModuleService: IProductModuleService = container.resolve(
    Modules.PRODUCT
  );

  try {
    // Retrieve order details
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["items", "shipping_address"],
    });

    // Retrieve product IDs from order items
    const productIds = order.items.map((item) => item.product_id);

    // Fetch product details, including metadata
    const products = await productModuleService.listProducts(
      { id: productIds },
      { select: ["id", "metadata"] }
    );

    // Filter items with 'blender' metadata
    const blenderItems = order.items.filter((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return product?.metadata?.blender === true;
    });

    if (blenderItems.length === 0) {
      console.log(
        'No items with "blender" metadata in this order. Exiting handler.'
      );
      return;
    }

    // Prepare and send email notification
    const adminEmail = "admin@example.com"; // Replace with actual admin email

    await notificationModuleService.createNotifications({
      to: adminEmail,
      channel: "email",
      template: "your-template-id", // Replace with your actual template ID
      data: {
        shipping_address: {
          first_name: order.shipping_address.first_name,
          last_name: order.shipping_address.last_name,
          address_1: order.shipping_address.address_1,
          address_2: order.shipping_address.address_2,
          city: order.shipping_address.city,
          province: order.shipping_address.province,
          postal_code: order.shipping_address.postal_code,
          country_code: order.shipping_address.country_code,
        },
        items: blenderItems.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: (item.unit_price / 100).toFixed(2), // Convert from cents to dollars
        })),
      },
    });

    console.log("Email notification sent successfully");
  } catch (error) {
    console.error("Error in BlenderCategoryOrderHandler:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
