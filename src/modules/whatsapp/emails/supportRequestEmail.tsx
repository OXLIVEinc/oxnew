import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface Props {
  name?: string | null;
  phone: string;
  category: string;
  message: string;
}

export function SupportRequestEmail({
  name,
  phone,
  category,
  message,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New WhatsApp Support Request</Preview>

      <Body
        style={{
          backgroundColor: '#f5f5f5',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <Container
          style={{
            backgroundColor: '#ffffff',
            padding: '32px',
            margin: '40px auto',
            borderRadius: '8px',
            maxWidth: '600px',
          }}
        >
          <Heading>New WhatsApp Support Request</Heading>

          <Section>
            <Text>
              <strong>Customer</strong>
              <br />
              {name || 'Unknown'}
            </Text>

            <Text>
              <strong>Phone</strong>
              <br />
              {phone}
            </Text>

            <Text>
              <strong>Category</strong>
              <br />
              {category}
            </Text>
          </Section>

          <Heading
            as="h2"
            style={{
              fontSize: '18px',
              marginTop: '32px',
            }}
          >
            Issue
          </Heading>

          <Text>{message}</Text>

          <Text
            style={{
              marginTop: '40px',
              color: '#666',
              fontSize: '12px',
            }}
          >
            This email was sent automatically by the OX WhatsApp Bot.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}