# Primitives

Primitives are atomic UI elements derived from shadcn/ui, themed for Lyel.

Examples:

- Buttons, badges, inputs, textarea
- Select, dropdown menu, dialog, popover, calendar
- Tabs, table, alert dialog, form helpers

Each primitive keeps the shadcn/ui API (`variant`, `size`, `asChild`) plus Lyel-specific styling.

```tsx
import { Button, Input, Dialog, DialogTrigger, DialogContent } from "@lyel/ls-ui/primitives";

function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Invite teammate</Button>
      </DialogTrigger>
      <DialogContent>
        <form className="space-y-4">
          <Input placeholder="Email" type="email" required />
          <Button type="submit">Send invite</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

All components ship with focus rings, aria attributes, and the LS token palette baked in. Mix and match freely with the layout/pattern layers.

