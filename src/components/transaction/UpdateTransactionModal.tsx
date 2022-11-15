import {
  Chip,
  createStyles,
  Group,
  Modal,
  Textarea,
  TextInput,
  Text,
  Title,
  Button,
  Collapse,
  Checkbox,
  Alert,
  LoadingOverlay,
  MultiSelect,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { QueryKey, TransactionType } from "enums";
import { Sanitization, Transaction } from "types";
import { displayCurrency } from "utils/displayCurrency";
import { displayDate } from "utils/displayDate";
import { FaInfoCircle } from "react-icons/fa";
import { useAddSanitizing, useUpdateTransaction } from "api";
import { useQueryClient } from "react-query";
import { useEffect, useState } from "react";
import { useFinance } from "context";
import { PrivacySheild } from "components/core/PrivacySheild";
import { CategorySelect, SubcategorySelect } from "components";

type Props = {
  opened: boolean;
  setOpen: (openState: boolean) => void;
  transaction: Transaction;
};

type SelectType = {
  value: string;
  label: string;
};

export const UpdateTransactionModal = ({
  opened = false,
  setOpen,
  transaction,
}: Props) => {
  const { classes } = useStyles();
  const [loading, setLoading] = useState(false);
  const [keywords, setKeyWords] = useState<SelectType[]>([]);
  const updateTransaction = useUpdateTransaction();
  const addSanitizing = useAddSanitizing();
  const queryClient = useQueryClient();
  const { selectedAccount, appendSubcategories } = useFinance();

  const initialFormValues = {
    sanitizedDescription: transaction.sanitizedDescription || "",
    type: transaction.type,
    category: transaction.category || "",
    subcategory: transaction.subcategory || "",
    vendor: transaction.vendor || "",
    useSanitize: false,
    keyword: [""],
  };

  const form = useForm({
    initialValues: {
      ...initialFormValues,
    },

    validate: {
      sanitizedDescription: (value: string) => {
        if (value == "") {
          return "Please enter a description";
        }
        if (!/^[a-zA-Z0-9-\s]*$/.test(value)) {
          return "This field can only contain letters, - and numbers";
        }
      },
      category: (value: string) => {
        if (!/^[a-zA-Z0-9-\s]*$/.test(value)) {
          return "This field can only contain letters, - and numbers";
        }
      },
      subcategory: (value: string) => {
        if (!/^[a-zA-Z0-9-\s]*$/.test(value)) {
          return "This field can only contain letters, - and numbers";
        }
      },
      vendor: (value: string) => {
        if (value == "") {
          return "Please enter a vender";
        }
        if (!/^[a-zA-Z0-9-\s]*$/.test(value)) {
          return "This field can only contain letters, - and numbers";
        }
      },
      keyword: (value: string[]) => {
        if (form.values.useSanitize && value.length === 0) {
          return "Please enter at least one keyword";
        }
      },
    },
  });

  useEffect(() => {
    form.setValues(initialFormValues);
  }, [transaction]);

  const handleSubmit = async (transaction: Transaction) => {
    setLoading(true);
    await updateTransaction.mutateAsync(transaction);
    await queryClient.refetchQueries({
      queryKey: [`${QueryKey.ListAllTransactions}-${selectedAccount}`],
    });
    await queryClient.refetchQueries({
      queryKey: [`${QueryKey.ListUnsanitizedTransactions}-${selectedAccount}`],
    });
    setOpen(false);
    form.reset();
    setLoading(false);
  };

  const handleSanitize = async (sanitized: Sanitization) => {
    await addSanitizing.mutateAsync(sanitized);
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setOpen(false), form.reset(), setLoading(false);
      }}
      closeOnClickOutside={false}
      title="Edit transaction"
      size="lg"
      radius="lg"
    >
      <div style={{ position: "relative" }}>
        <LoadingOverlay visible={loading} overlayBlur={2} />
        <form
          onSubmit={form.onSubmit((values) => {
            const record = {
              ...transaction,
              sanitizedDescription: values.sanitizedDescription,
              type: values.type,
              category: values.category,
              subcategory: values.subcategory,
              vendor: values.vendor,
            };
            if (values.useSanitize) {
              const sanitize = {
                keywords: values.keyword,
                sanitizedDescription: values.sanitizedDescription,
                type: values.type,
                category: values.category,
                subcategory: values.subcategory,
                vendor: values.vendor,
              };
              handleSanitize(sanitize);
            }
            handleSubmit(record);
          })}
        >
          <Group className={classes.group}>
            <Group className={classes.group}>
              <Title order={3}>{displayDate(transaction.date)}</Title>
              <PrivacySheild>
                <Title>
                  {displayCurrency(
                    transaction.debit ? transaction.debit : transaction.credit
                  )}
                </Title>
              </PrivacySheild>
              <Text align={"center"}>{transaction.rawDescription}</Text>
            </Group>
            <Group className={classes.group} position={"left"} spacing={"xs"}>
              <Text className={classes.typeLabel}>Transaction Type</Text>
              <Chip.Group
                className={classes.chipGroup}
                position="left"
                {...form.getInputProps("type")}
              >
                <Chip
                  value={TransactionType.INCOME}
                  color="green"
                  variant="filled"
                  size="md"
                  disabled={transaction.credit ? false : true}
                >
                  {TransactionType.INCOME}
                </Chip>
                <Chip
                  value={TransactionType.EXPENSE}
                  color="red"
                  variant="filled"
                  size="md"
                  disabled={transaction.credit ? true : false}
                >
                  {TransactionType.EXPENSE}
                </Chip>
                <Chip
                  value={TransactionType.TRANSFER}
                  color="yellow"
                  variant="filled"
                  size="md"
                >
                  {TransactionType.TRANSFER}
                </Chip>
              </Chip.Group>
            </Group>
            <Textarea
              className={classes.input}
              label="New Description"
              placeholder="Holiday Fish and Chips"
              radius="lg"
              withAsterisk
              {...form.getInputProps("sanitizedDescription")}
            />
            <CategorySelect
              className={classes.input}
              props={form.getInputProps("category")}
            />
            <SubcategorySelect
              className={classes.input}
              props={form.getInputProps("subcategory")}
            />
            <TextInput
              className={classes.input}
              label="vendor"
              description="The vendor where the transaction occured"
              radius="lg"
              withAsterisk
              {...form.getInputProps("vendor")}
            />
            <Checkbox
              className={classes.input}
              label="Use these details to match similar future transactions"
              {...form.getInputProps("useSanitize")}
            />
            <Collapse
              className={classes.collapse}
              in={form.getInputProps("useSanitize").value}
            >
              <Group spacing={"lg"}>
                <Alert
                  icon={<FaInfoCircle size={16} />}
                  color="indigo"
                  radius="lg"
                >
                  <Text>
                    This section is used for the automated matching of
                    transactions. The details above will be applied to similar
                    transactions in the future that match the given key work you
                    provide bellow.
                  </Text>
                  <Text>
                    We suggest taking the unique keyword/s from the description
                    to ensure the success of the automated matching process.
                  </Text>
                </Alert>
                <Text>{transaction.rawDescription}</Text>
                <MultiSelect
                  className={classes.input}
                  label="Keyword match"
                  data={keywords}
                  description="These values will be used to match the default description of the transaction"
                  placeholder="purchase"
                  searchable
                  creatable
                  getCreateLabel={(query) => `+ Add ${query} keyword/s`}
                  onCreate={(query) => {
                    const item = { value: query, label: query };
                    setKeyWords((current) => [...current, item]);
                    return item;
                  }}
                  radius="lg"
                  {...form.getInputProps("keyword")}
                />
              </Group>
            </Collapse>
            <Button radius="lg" type={"submit"}>
              Update Transaction
            </Button>
          </Group>
        </form>
      </div>
    </Modal>
  );
};

const useStyles = createStyles((theme) => ({
  group: {
    display: "flex",
    width: "100%",
    flexDirection: "column",
    flexWrap: "nowrap",
  },
  chipGroup: {
    width: "100%",
  },
  typeLabel: {
    width: "100%",
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,
  },
  input: {
    width: "100%",
  },
  collapse: {
    width: "100%",
  },
}));
