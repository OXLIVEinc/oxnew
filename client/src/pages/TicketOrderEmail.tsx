// import {
//   Body,
//   Container,
//   Head,
//   Heading,
//   Html,
//   Preview,
//   Section,
//   Text,
//   Hr,
// } from "@react-email/components";

// interface Props {
//   order: any;
// }

// export function TicketOrderEmail({ order }: Props) {
//   return (
//     <Html>
//       <Head />

//       <Preview>
//         Your tickets for {order.event.title}
//       </Preview>

//       <Body
//         style={{
//           background: "#f5f5f5",
//           fontFamily: "Arial, sans-serif",
//         }}
//       >
//         <Container
//           style={{
//             background: "#fff",
//             padding: 32,
//             borderRadius: 8,
//             margin: "40px auto",
//             maxWidth: 600,
//           }}
//         >
//           <Heading>Your Tickets</Heading>

//           <Text>
//             Thank you for your purchase.
//           </Text>

//           <Section>
//             <Text>
//               <strong>Event</strong>
//               <br />
//               {order.event.title}
//             </Text>

//             <Text>
//               <strong>Reference</strong>
//               <br />
//               {order.reference}
//             </Text>

//             <Text>
//               <strong>Date</strong>
//               <br />
//               {new Date(order.event.startsAt).toLocaleString()}
//             </Text>

//             <Text>
//               <strong>Venue</strong>
//               <br />
//               {order.event.address}
//             </Text>
//           </Section>

//           <Hr />

//           <Heading
//             as="h2"
//             style={{
//               fontSize: 18,
//             }}
//           >
//             Tickets
//           </Heading>

//           {order.tickets.map((ticket: any, index: number) => (
//             <Section
//               key={ticket.id}
//               style={{
//                 marginBottom: 24,
//               }}
//             >
//               <Text>
//                 <strong>Ticket #{index + 1}</strong>
//               </Text>

//               <Text>Name: {ticket.attendeeName}</Text>

//               <Text>Email: {ticket.attendeeEmail}</Text>

//               <Text>Check-in Code: {ticket.checkInCode}</Text>


//               <img
//                 src={ticket.qrCode}
//                 width="180"
//                 alt="QR Code"
//               />

//               <Hr />
//             </Section>
//           ))}

//           <Text
//             style={{
//               color: "#666",
//               fontSize: 12,
//               marginTop: 32,
//             }}
//           >
//             Please present this QR code at the entrance for check-in.
//           </Text>
//         </Container>
//       </Body>
//     </Html>
//   );
// }